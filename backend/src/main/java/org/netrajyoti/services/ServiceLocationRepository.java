package org.netrajyoti.services;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Reserved for verified partner-maintained service listings; demo UI must not imply live availability. */
public interface ServiceLocationRepository extends JpaRepository<ServiceLocation, Long> {
  List<ServiceLocation> findByDistrictIgnoreCaseAndActiveTrue(String district);
}
