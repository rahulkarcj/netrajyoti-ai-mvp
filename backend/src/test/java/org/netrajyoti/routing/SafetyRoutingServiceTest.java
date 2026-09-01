package org.netrajyoti.routing;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.netrajyoti.ai.ApprovedClinicalKnowledgeRepository;
import org.netrajyoti.ai.ClinicalRoutingCriterion;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;

class SafetyRoutingServiceTest {
  private final ApprovedClinicalKnowledgeRepository knowledge = mock(ApprovedClinicalKnowledgeRepository.class);
  private final SafetyRoutingService service = new SafetyRoutingService(knowledge);
  @Test void urgentCriteriaTakePrecedence() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet()))
        .thenReturn(List.of(new ClinicalRoutingCriterion("u", "URGENT_IF_ANY", "SEVERE_PAIN"), new ClinicalRoutingCriterion("r", "ROUTINE_IF_ANY", "BLURRY_VISION")));
    assertThat(service.route(new RoutingRequest(Set.of(Concern.SEVERE_PAIN, Concern.BLURRY_VISION), false)).outcome()).isEqualTo(RoutingOutcome.URGENT);
  }
  @Test void urgentCriteriaTakePrecedenceOverRequestForHumanSupport() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet()))
        .thenReturn(List.of(new ClinicalRoutingCriterion("u", "URGENT_IF_ANY", "SEVERE_PAIN")));
    assertThat(service.route(new RoutingRequest(Set.of(Concern.SEVERE_PAIN), true)).outcome()).isEqualTo(RoutingOutcome.URGENT);
  }
  @Test void urgentBaselineTakesPrecedenceOverRequestForHumanSupportWhenCriteriaAreUnavailable() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet())).thenReturn(List.of());
    when(knowledge.isDemoRagEnabled()).thenReturn(false);
    assertThat(service.route(new RoutingRequest(Set.of(Concern.SUDDEN_VISION_CHANGE), true)).outcome()).isEqualTo(RoutingOutcome.URGENT);
  }
  @Test void requestForHumanSupportOverridesNonUrgentRoutineRoute() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet()))
        .thenReturn(List.of(new ClinicalRoutingCriterion("r", "ROUTINE_IF_ANY", "BLURRY_VISION")));
    assertThat(service.route(new RoutingRequest(Set.of(Concern.BLURRY_VISION), true)).outcome()).isEqualTo(RoutingOutcome.HUMAN_SUPPORT);
  }
  @Test void escalationCriteriaRouteToHumanSupport() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet()))
        .thenReturn(List.of(new ClinicalRoutingCriterion("h", "ESCALATE_IF_ANY", "OTHER")));
    assertThat(service.route(new RoutingRequest(Set.of(Concern.OTHER), false)).outcome()).isEqualTo(RoutingOutcome.HUMAN_SUPPORT);
  }
  @Test void routineCriteriaRouteToRoutine() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet()))
        .thenReturn(List.of(new ClinicalRoutingCriterion("r", "ROUTINE_IF_ANY", "BLURRY_VISION")));
    assertThat(service.route(new RoutingRequest(Set.of(Concern.BLURRY_VISION), false)).outcome()).isEqualTo(RoutingOutcome.ROUTINE);
  }
  @Test void optionalHistoryDoesNotOverrideRoutineCriteria() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet()))
        .thenReturn(List.of(new ClinicalRoutingCriterion("r", "ROUTINE_IF_ANY", "READING_OR_DISTANCE_DIFFICULTY")));
    assertThat(service.route(new RoutingRequest(
        Set.of(Concern.READING_OR_DISTANCE_DIFFICULTY), Set.of(HistoryCode.PREVIOUS_EYE_INJURY), false)).outcome())
        .isEqualTo(RoutingOutcome.ROUTINE);
  }
  @Test void definedNonUrgentRednessCriterionRoutesToRoutine() {
    when(knowledge.findRoutingCriteria(org.mockito.ArgumentMatchers.anySet(), org.mockito.ArgumentMatchers.anySet()))
        .thenReturn(List.of(new ClinicalRoutingCriterion("r", "ROUTINE_IF_ANY", "REDNESS_OR_DISCHARGE")));
    assertThat(service.route(new RoutingRequest(Set.of(Concern.REDNESS_OR_DISCHARGE), false)).outcome()).isEqualTo(RoutingOutcome.ROUTINE);
  }
}
