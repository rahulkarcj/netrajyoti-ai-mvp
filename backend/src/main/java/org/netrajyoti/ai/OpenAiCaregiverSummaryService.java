package org.netrajyoti.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.netrajyoti.routing.RoutingOutcome;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class OpenAiCaregiverSummaryService {
  private final boolean enabled;
  private final String apiKey;
  private final String model;
  private final RestClient client;
  private final ObjectMapper objectMapper;

  public OpenAiCaregiverSummaryService(
      @Value("${netrajyoti.ai-summary.enabled:false}") boolean enabled,
      @Value("${netrajyoti.ai-summary.api-key:}") String apiKey,
      @Value("${netrajyoti.ai-summary.model:gpt-5.6-sol}") String model,
      RestClient.Builder clientBuilder,
      ObjectMapper objectMapper) {
    this.enabled = enabled; this.apiKey = apiKey; this.model = model;
    this.client = clientBuilder.baseUrl("https://api.openai.com").build(); this.objectMapper = objectMapper;
  }

  public AiSummaryResponse createRoutineSummary(RoutingOutcome outcome) {
    if (outcome != RoutingOutcome.ROUTINE) throw new IllegalArgumentException("AI summaries are available only after a ROUTINE outcome.");
    if (!enabled || apiKey.isBlank()) return fallback();
    try {
      JsonNode response = client.post().uri("/v1/responses")
          .header("Authorization", "Bearer " + apiKey)
          .contentType(MediaType.APPLICATION_JSON).body(requestBody()).retrieve().body(JsonNode.class);
      String text = response == null ? null : response.path("output_text").asText(null);
      String summary = text == null ? null : objectMapper.readTree(text).path("summary_bn").asText(null);
      return CaregiverSummaryPolicy.isSafe(summary) ? new AiSummaryResponse(summary, "AI_VALIDATED") : fallback();
    } catch (Exception ignored) { return fallback(); }
  }

  private Map<String, Object> requestBody() {
    String rules = "Create one short Bengali caregiver summary using only the approved content provided. Do not diagnose, name a disease, mention medicine, prescribe treatment, change urgency, add an urgent instruction, or invent a provider, address, time, or service. Return JSON only.";
    Map<String, Object> schema = Map.of("type", "object", "additionalProperties", false,
        "properties", Map.of("summary_bn", Map.of("type", "string")), "required", List.of("summary_bn"));
    return Map.of("model", model, "store", false,
        "input", List.of(Map.of("role", "developer", "content", List.of(Map.of("type", "input_text", "text", rules))),
            Map.of("role", "user", "content", List.of(Map.of("type", "input_text", "text", CaregiverSummaryPolicy.APPROVED_FALLBACK)))),
        "text", Map.of("format", Map.of("type", "json_schema", "name", "caregiver_summary", "strict", true, "schema", schema)));
  }
  private AiSummaryResponse fallback() { return new AiSummaryResponse(CaregiverSummaryPolicy.APPROVED_FALLBACK, "APPROVED_FALLBACK"); }
}
