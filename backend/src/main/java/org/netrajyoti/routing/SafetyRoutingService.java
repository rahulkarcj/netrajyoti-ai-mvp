package org.netrajyoti.routing;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.netrajyoti.ai.ApprovedClinicalKnowledgeRepository;
import org.netrajyoti.ai.ClinicalRoutingCriterion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Java applies database criteria with fixed, reviewable route precedence. */
@Service
public class SafetyRoutingService {
  private static final Logger log = LoggerFactory.getLogger(SafetyRoutingService.class);
  static final String RULE_VERSION = "2026.08.31";
  private static final Set<Concern> BASELINE_URGENT = EnumSet.of(
      Concern.SUDDEN_VISION_CHANGE, Concern.SEVERE_PAIN, Concern.INJURY_OR_CHEMICAL);
  private final ApprovedClinicalKnowledgeRepository knowledge;

  public SafetyRoutingService(ApprovedClinicalKnowledgeRepository knowledge) {
    this.knowledge = knowledge;
  }

  public RoutingResponse route(RoutingRequest request) {
    List<ClinicalRoutingCriterion> criteria = knowledge.findRoutingCriteria(request.concerns(), request.history());
    log.info("Routing input: concerns={}, history={}, needsHumanSupport={}, matchedCriteria={}",
        request.concerns(), request.history(), request.needsHumanSupport(), criteria);
    RoutingOutcome clinicalOutcome;
    if (criteria.isEmpty()) {
      // In the simulated demo, insufficient criteria deliberately fail closed
      // to human support. In normal mode, retain the existing conservative
      // baseline until qualified reviewers publish database criteria.
      clinicalOutcome = knowledge.isDemoRagEnabled()
          ? RoutingOutcome.HUMAN_SUPPORT
          : baselineRoute(request);
      log.warn("No eligible database routing criteria; applying fallback route={}", clinicalOutcome);
    } else {
      clinicalOutcome = applyCriteria(criteria);
      log.info("Applied database routing criteria: criteriaCount={}, route={}, demoMode={}",
          criteria.size(), clinicalOutcome, knowledge.isDemoRagEnabled());
    }
    // A request for a person supplements care; it must never downgrade an
    // urgent route determined by approved criteria or the conservative baseline.
    RoutingOutcome finalOutcome = clinicalOutcome == RoutingOutcome.URGENT
        ? RoutingOutcome.URGENT
        : request.needsHumanSupport() ? RoutingOutcome.HUMAN_SUPPORT : clinicalOutcome;
    log.info("Routing outcome: clinicalOutcome={}, finalOutcome={}", clinicalOutcome, finalOutcome);
    return response(finalOutcome);
  }

  private static RoutingOutcome baselineRoute(RoutingRequest request) {
    if (request.concerns().stream().anyMatch(BASELINE_URGENT::contains)) return RoutingOutcome.URGENT;
    if (request.concerns().contains(Concern.OTHER)) return RoutingOutcome.HUMAN_SUPPORT;
    return RoutingOutcome.ROUTINE;
  }

  private RoutingOutcome applyCriteria(List<ClinicalRoutingCriterion> criteria) {
    // Fixed precedence is deterministic and reviewable. A lower-priority rule
    // cannot downgrade an urgent or escalation condition.
    if (hasType(criteria, "URGENT_IF_ANY")) return RoutingOutcome.URGENT;
    if (hasType(criteria, "ESCALATE_IF_ANY")) return RoutingOutcome.HUMAN_SUPPORT;
    if (hasType(criteria, "ROUTINE_IF_ANY")) return RoutingOutcome.ROUTINE;
    return RoutingOutcome.HUMAN_SUPPORT;
  }

  private static boolean hasType(List<ClinicalRoutingCriterion> criteria, String type) {
    return criteria.stream().anyMatch(criterion -> type.equals(criterion.criterionType()));
  }
  private RoutingResponse response(RoutingOutcome outcome) { return new RoutingResponse(outcome, RULE_VERSION); }
}
