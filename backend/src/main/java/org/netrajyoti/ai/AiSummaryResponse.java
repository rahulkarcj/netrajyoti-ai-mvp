package org.netrajyoti.ai;

import java.util.List;

public record AiSummaryResponse(String summaryBn, String source, List<ClinicalSource> sources) { }
