package org.netrajyoti.ai;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.netrajyoti.routing.Concern;
import org.netrajyoti.routing.HistoryCode;
import org.netrajyoti.routing.RoutingOutcome;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Retrieves versioned clinical content from PostgreSQL. Demo records are
 * eligible only when an explicit backend-only demo flag is enabled. Java
 * applies retrieved criteria deterministically; Ollama receives guidance only
 * after a route has been selected.
 */
@Repository
public class ApprovedClinicalKnowledgeRepository {
  private static final String APPROVED = "APPROVED";
  private static final String DEMO_SIMULATED = "DEMO_SIMULATED_NOT_FOR_CLINICAL_USE";
  private final JdbcTemplate jdbc;
  private final boolean demoRagEnabled;

  public ApprovedClinicalKnowledgeRepository(
      JdbcTemplate jdbc,
      @org.springframework.beans.factory.annotation.Value("${netrajyoti.ai-summary.demo-rag-enabled:false}")
      boolean demoRagEnabled) {
    this.jdbc = jdbc;
    this.demoRagEnabled = demoRagEnabled;
  }

  public boolean isDemoRagEnabled() { return demoRagEnabled; }

  public List<ClinicalRoutingCriterion> findRoutingCriteria(
      Set<Concern> concerns, Set<HistoryCode> history) {
    List<String> codes = inputCodes(concerns, history);
    if (codes.isEmpty()) return List.of();
    List<String> eligibleStatuses = eligibleStatuses();
    String statusPlaceholders = String.join(",", Collections.nCopies(eligibleStatuses.size(), "?"));
    String codePlaceholders = String.join(",", Collections.nCopies(codes.size(), "?"));
    return jdbc.query("""
        select c.pathway_id, c.criterion_type, c.input_code
        from clinical_criterion c
        join clinical_pathway p on p.pathway_id = c.pathway_id
        where p.status in (%s) and c.input_code in (%s)
        order by c.pathway_id, c.criterion_type, c.input_code
        """.formatted(statusPlaceholders, codePlaceholders),
        (resultSet, rowNumber) -> new ClinicalRoutingCriterion(
            resultSet.getString("pathway_id"),
            resultSet.getString("criterion_type"),
            resultSet.getString("input_code")),
        criteriaArguments(eligibleStatuses, codes));
  }

  public List<ClinicalKnowledgeDocument> findRouteDocuments(
      RoutingOutcome route, Set<Concern> concerns, Set<HistoryCode> history) {
    List<String> eligibleStatuses = eligibleStatuses();
    String statusPlaceholders = String.join(",", Collections.nCopies(eligibleStatuses.size(), "?"));
    List<Map<String, Object>> rows = jdbc.queryForList("""
        select p.pathway_id, p.title, p.approved_on, g.guidance_text, s.source_id,
               s.title as source_title, s.accessed_on
        from clinical_pathway p
        join clinical_guidance g on g.pathway_id = p.pathway_id
        left join clinical_pathway_source ps on ps.pathway_id = p.pathway_id
        left join clinical_source s on s.source_id = ps.source_id
        where p.status in (%s) and g.status in (%s) and g.route = ? and g.language = 'bn'
        order by p.approved_on desc nulls last, p.pathway_id
        limit 12
        """.formatted(statusPlaceholders, statusPlaceholders),
        routeArguments(eligibleStatuses, route));
    Map<String, ClinicalKnowledgeDocument> documents = new LinkedHashMap<>();
    for (Map<String, Object> row : rows) {
      String pathwayId = (String) row.get("pathway_id");
      String sourceId = (String) row.get("source_id");
      ClinicalSource source = new ClinicalSource(
          sourceId == null ? pathwayId : sourceId,
          (String) (row.get("source_title") == null ? row.get("title") : row.get("source_title")),
          String.valueOf(row.get("accessed_on") == null ? row.get("approved_on") : row.get("accessed_on")));
      documents.putIfAbsent(pathwayId, new ClinicalKnowledgeDocument(
          source, route, concerns == null ? Set.of() : Set.copyOf(concerns), (String) row.get("guidance_text")));
    }
    return List.copyOf(documents.values());
  }

  private static List<String> inputCodes(Set<Concern> concerns, Set<HistoryCode> history) {
    List<String> codes = new ArrayList<>(concerns == null ? List.of() : concerns.stream().map(Enum::name).toList());
    if (history != null) codes.addAll(history.stream().map(Enum::name).toList());
    return codes;
  }

  private List<String> eligibleStatuses() {
    return demoRagEnabled ? List.of(APPROVED, DEMO_SIMULATED) : List.of(APPROVED);
  }

  private static Object[] criteriaArguments(List<String> statuses, List<String> codes) {
    Object[] args = new Object[statuses.size() + codes.size()];
    int index = 0;
    for (String status : statuses) args[index++] = status;
    for (String code : codes) args[index++] = code;
    return args;
  }

  private static Object[] routeArguments(List<String> statuses, RoutingOutcome route) {
    Object[] args = new Object[statuses.size() * 2 + 1];
    int index = 0;
    for (String status : statuses) args[index++] = status;
    for (String status : statuses) args[index++] = status;
    args[index] = route.name();
    return args;
  }
}
