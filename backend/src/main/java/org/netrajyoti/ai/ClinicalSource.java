package org.netrajyoti.ai;

/** Public, non-sensitive source metadata displayed with a RAG answer. */
public record ClinicalSource(String id, String title, String reviewedOn) { }
