package org.netrajyoti.ai;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/ai")
public class AiSummaryController {
  private final OpenAiCaregiverSummaryService service;
  public AiSummaryController(OpenAiCaregiverSummaryService service) { this.service = service; }
  @PostMapping("/caregiver-summary")
  public AiSummaryResponse caregiverSummary(@Valid @RequestBody AiSummaryRequest request) {
    try { return service.createRoutineSummary(request.outcome()); }
    catch (IllegalArgumentException exception) { throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Routine outcome required"); }
  }
}
