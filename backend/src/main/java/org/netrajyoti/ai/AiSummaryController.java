package org.netrajyoti.ai;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/ai")
public class AiSummaryController {
  private final OllamaRagCareAdviceService service;
  public AiSummaryController(OllamaRagCareAdviceService service) { this.service = service; }
  @PostMapping("/route-explanation")
  public AiSummaryResponse routeExplanation(@Valid @RequestBody AiSummaryRequest request) {
    try { return service.createRouteExplanation(request.outcome(), request.concerns(), request.history()); }
    catch (IllegalArgumentException exception) { throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid route explanation request"); }
  }
}
