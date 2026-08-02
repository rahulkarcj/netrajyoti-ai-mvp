package org.netrajyoti.ai;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class CaregiverSummaryPolicyTest {
  @Test void approvesShortNeutralBengaliCaregiverSummary() {
    assertThat(CaregiverSummaryPolicy.isSafe("পরিবারের একজন সদস্যকে সঙ্গে নিয়ে চোখ পরীক্ষা করানোর সময় ঠিক করুন।")).isTrue();
  }
  @Test void rejectsDiagnosisMedicationAndUrgencyClaims() {
    assertThat(CaregiverSummaryPolicy.isSafe("এটি একটি রোগ, ওষুধ নিন এবং আজই হাসপাতালে যান।")).isFalse();
  }
}
