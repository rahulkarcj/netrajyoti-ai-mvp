package org.netrajyoti.ai;

/**
 * A versioned criterion retrieved from the governed knowledge store. Java,
 * not the model, applies its type and precedence to select a route.
 */
public record ClinicalRoutingCriterion(String pathwayId, String criterionType, String inputCode) { }
