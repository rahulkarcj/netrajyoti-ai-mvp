package org.netrajyoti.ai;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;
import org.netrajyoti.routing.Concern;
import org.netrajyoti.routing.HistoryCode;
import org.netrajyoti.routing.RoutingOutcome;

/** This endpoint intentionally accepts no health narrative, voice, location, or identifiers. */
public record AiSummaryRequest(
    @NotNull RoutingOutcome outcome,
    @NotEmpty Set<Concern> concerns,
    Set<HistoryCode> history) { }
