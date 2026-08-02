package org.netrajyoti.services;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "service_locations")
public class ServiceLocation {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
  @Column(nullable = false) private String name;
  @Column(name = "service_type", nullable = false) private String serviceType;
  @Column(nullable = false) private String district;
  @Column(nullable = false) private String address;
  private String phone;
  @Column(name = "verified_at", nullable = false) private OffsetDateTime verifiedAt;
  @Column(nullable = false) private boolean active = true;
  protected ServiceLocation() { }
  public Long getId() { return id; }
  public String getName() { return name; }
  public String getServiceType() { return serviceType; }
  public String getDistrict() { return district; }
  public String getAddress() { return address; }
  public String getPhone() { return phone; }
  public boolean isActive() { return active; }
}
