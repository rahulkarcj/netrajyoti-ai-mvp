package org.netrajyoti.ai;

import java.util.Set;
import org.netrajyoti.routing.Concern;
import org.netrajyoti.routing.RoutingOutcome;

record ClinicalKnowledgeDocument(
    ClinicalSource source,
    RoutingOutcome route,
    Set<Concern> concerns,
    String content) { }
