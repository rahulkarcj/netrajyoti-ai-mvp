package org.netrajyoti.routing;

import java.util.EnumSet;
import java.util.Set;
import org.springframework.stereotype.Service;

/** Deterministic safety rules. Clinical changes require clinician review and a new rule version. */
@Service
public class SafetyRoutingService {
  static final String RULE_VERSION = "2026.08.01";
  private static final Set<Concern> URGENT = EnumSet.of(Concern.SUDDEN_VISION_CHANGE, Concern.SEVERE_PAIN, Concern.INJURY_OR_CHEMICAL);
  public RoutingResponse route(RoutingRequest request) {
    if (request.concerns().stream().anyMatch(URGENT::contains)) return response(RoutingOutcome.URGENT);
    if (request.needsHumanSupport() || request.concerns().contains(Concern.OTHER)) return response(RoutingOutcome.HUMAN_SUPPORT);
    return response(RoutingOutcome.ROUTINE);
  }
  private RoutingResponse response(RoutingOutcome outcome) { return new RoutingResponse(outcome, RULE_VERSION); }
}
