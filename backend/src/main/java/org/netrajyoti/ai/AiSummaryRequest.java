package org.netrajyoti.ai;

import jakarta.validation.constraints.NotNull;
import org.netrajyoti.routing.RoutingOutcome;

/** This endpoint intentionally accepts no health narrative, voice, location, or identifiers. */
public record AiSummaryRequest(@NotNull RoutingOutcome outcome) { }
