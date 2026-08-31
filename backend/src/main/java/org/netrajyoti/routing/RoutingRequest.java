package org.netrajyoti.routing;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Collections;
import java.util.Set;
public record RoutingRequest(
    @NotEmpty Set<@NotNull Concern> concerns,
    Set<@NotNull HistoryCode> history,
    boolean needsHumanSupport) {
  public RoutingRequest {
    history = history == null ? Collections.emptySet() : Set.copyOf(history);
  }

  /** Compatibility constructor for callers that have no optional history. */
  public RoutingRequest(Set<Concern> concerns, boolean needsHumanSupport) {
    this(concerns, Collections.emptySet(), needsHumanSupport);
  }
}
