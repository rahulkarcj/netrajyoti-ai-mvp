package org.netrajyoti.routing;

import java.util.Set;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class SafetyRoutingServiceTest {
  private final SafetyRoutingService service = new SafetyRoutingService();
  @Test void suddenVisionChangeIsAlwaysUrgent() { assertThat(service.route(new RoutingRequest(Set.of(Concern.SUDDEN_VISION_CHANGE), true)).outcome()).isEqualTo(RoutingOutcome.URGENT); }
  @Test void otherConcernRoutesToHumanSupport() { assertThat(service.route(new RoutingRequest(Set.of(Concern.OTHER), false)).outcome()).isEqualTo(RoutingOutcome.HUMAN_SUPPORT); }
  @Test void nonUrgentConcernRoutesToRoutine() { assertThat(service.route(new RoutingRequest(Set.of(Concern.BLURRY_VISION), false)).outcome()).isEqualTo(RoutingOutcome.ROUTINE); }
}
