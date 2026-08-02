package org.netrajyoti.routing;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/routing")
public class RoutingController {
  private final SafetyRoutingService safetyRoutingService;
  public RoutingController(SafetyRoutingService safetyRoutingService) { this.safetyRoutingService = safetyRoutingService; }
  @PostMapping("/evaluate")
  public RoutingResponse evaluate(@Valid @RequestBody RoutingRequest request) { return safetyRoutingService.route(request); }
}
