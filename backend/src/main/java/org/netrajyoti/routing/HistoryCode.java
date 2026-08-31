package org.netrajyoti.routing;

/**
 * Optional, structured previous eye-care information. This is not a medical
 * record and must not be populated from free-text or uploaded documents.
 */
public enum HistoryCode {
  PREVIOUS_EYE_SURGERY,
  PREVIOUS_EYE_INJURY,
  USES_SPECTACLES,
  USES_CONTACT_LENSES,
  KNOWN_EYE_CONDITION,
  ONGOING_EYE_TREATMENT,
  NOT_SURE
}
