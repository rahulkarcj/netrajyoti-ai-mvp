package org.netrajyoti.routing;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
public record RoutingRequest(@NotEmpty Set<@NotNull Concern> concerns, boolean needsHumanSupport) { }
