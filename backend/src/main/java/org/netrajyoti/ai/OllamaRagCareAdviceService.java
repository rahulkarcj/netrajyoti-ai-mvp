package org.netrajyoti.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.netrajyoti.routing.Concern;
import org.netrajyoti.routing.HistoryCode;
import org.netrajyoti.routing.RoutingOutcome;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Ollama explains Java's selected route; it never selects or changes one. */
@Service
public class OllamaRagCareAdviceService {
  private static final Logger log = LoggerFactory.getLogger(OllamaRagCareAdviceService.class);
  private final boolean enabled;
  private final String model;
  private final RestClient client;
  private final ObjectMapper objectMapper;
  private final ApprovedClinicalKnowledgeRepository knowledge;

  public OllamaRagCareAdviceService(
      @Value("${netrajyoti.ai-summary.enabled:false}") boolean enabled,
      @Value("${netrajyoti.ai-summary.base-url:http://localhost:11434}") String baseUrl,
      @Value("${netrajyoti.ai-summary.model:llama3.2:3b}") String model,
      RestClient.Builder clientBuilder,
      ObjectMapper objectMapper,
      ApprovedClinicalKnowledgeRepository knowledge) {
    this.enabled = enabled;
    this.model = model;
    SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout(Duration.ofSeconds(10));
    requestFactory.setReadTimeout(Duration.ofSeconds(75));
    this.client = clientBuilder.requestFactory(requestFactory).baseUrl(baseUrl).build();
    this.objectMapper = objectMapper;
    this.knowledge = knowledge;
  }

  public AiSummaryResponse createRouteExplanation(
      RoutingOutcome outcome, Set<Concern> concerns, Set<HistoryCode> history) {
    if (outcome == null || concerns == null || concerns.isEmpty()) {
      throw new IllegalArgumentException("A selected route and structured symptoms are required.");
    }
    List<ClinicalKnowledgeDocument> documents = knowledge.findRouteDocuments(outcome, concerns, history);
    if (!enabled) {
      log.info("Ollama response not generated; displaying fixed Java safety fallback: route={}, reason=AI_SUMMARY_DISABLED", outcome);
      return fallback(outcome, documents);
    }
    if (documents.isEmpty()) {
      log.warn("Ollama response not generated; displaying fixed Java safety fallback: route={}, reason=NO_ROUTE_GUIDANCE_RETRIEVED", outcome);
      return fallback(outcome, documents);
    }
    log.info("Creating Ollama route explanation: route={}, retrievedDocuments={}", outcome, documents.size());
    try {
      JsonNode response = client.post().uri("/api/chat").contentType(MediaType.APPLICATION_JSON)
          .body(requestBody(outcome, documents)).retrieve().body(JsonNode.class);
      String content = response == null ? null : response.path("message").path("content").asText(null);
      String advice = extractAdvice(content);
      if (!CaregiverSummaryPolicy.isSafeForRoute(advice, outcome)) {
        log.warn("Ollama response not used; displaying fixed Java safety fallback: route={}, reason=OUTPUT_REJECTED_BY_JAVA_SAFETY_VALIDATION", outcome);
        return fallback(outcome, documents);
      }
      log.info("Validated Ollama route explanation: route={}", outcome);
      return new AiSummaryResponse(advice, "OLLAMA_RAG_VALIDATED", sources(documents));
    } catch (Exception exception) {
      log.warn("Ollama response not generated; displaying fixed Java safety fallback: route={}, reason={}", outcome, exception.getClass().getSimpleName());
      return fallback(outcome, documents);
    }
  }

  private Map<String, Object> requestBody(RoutingOutcome outcome, List<ClinicalKnowledgeDocument> documents) {
    String retrievedContent = documents.stream().map(document -> "[" + document.source().id() + "] " + document.content())
        .reduce("", (left, right) -> left + "\n\n" + right);
    String instructions = "Write exactly one concise Bengali eye-care navigation sentence, maximum 28 Bengali words. "
        + "The Java-selected route is " + outcome.name() + ". Preserve it exactly. Use ONLY the retrieved Bengali content. "
        + "This is not a diagnosis. Do not name a disease, medicine, dosage, treatment, cure, provider, address, price, appointment, or medical certainty. "
        + "Do not reduce urgency. Return Bengali text only: no JSON, Markdown, heading, or quotation marks.\n\nRetrieved content:\n" + retrievedContent;
    return Map.of("model", model, "stream", false, "keep_alive", "10m",
        "options", Map.of("temperature", 0.1, "num_predict", 128, "num_ctx", 1024),
        "messages", List.of(Map.of("role", "system", "content", instructions)));
  }

  /**
   * Ollama is asked for plain Bengali text. Defensive JSON support is retained
   * for compatible models; malformed JSON is rejected. Safety policy
   * validation applies to every returned candidate.
   */
  private String extractAdvice(String content) throws JsonProcessingException {
    if (content == null || content.isBlank()) return null;
    String trimmed = content.trim();
    String advice = !trimmed.startsWith("{")
        ? trimmed
        : objectMapper.readTree(trimmed).path("advice_bn").asText(null);
    if (advice == null) return null;
    // Some local chat templates prepend a role label despite the instruction.
    // It is metadata, not patient-facing guidance.
    return advice.replaceFirst(
        "(?iu)^(?:<\\|assistant\\|>|assistant\\s*[:：\\-–—]?|সহকারী\\s*[:：\\-–—]?)\\s*", "").trim();
  }

  private AiSummaryResponse fallback(RoutingOutcome outcome, List<ClinicalKnowledgeDocument> documents) {
    return new AiSummaryResponse(CaregiverSummaryPolicy.fallbackFor(outcome), "SAFE_FIXED_FALLBACK", sources(documents));
  }

  private List<ClinicalSource> sources(List<ClinicalKnowledgeDocument> documents) {
    return documents.stream().map(ClinicalKnowledgeDocument::source).distinct().toList();
  }
}
