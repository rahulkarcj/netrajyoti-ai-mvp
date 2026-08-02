package org.netrajyoti.ai;

import java.util.Locale;

/** Final product-side guardrail; model output is never trusted by itself. */
public final class CaregiverSummaryPolicy {
  public static final String APPROVED_FALLBACK = "কয়েক দিনের মধ্যে চোখ পরীক্ষা করাতে ভিশন সেন্টার বা চোখের ক্লিনিকে যাওয়ার পরিকল্পনা করুন। যাওয়ার আগে পরিষেবার সময় নিশ্চিত করুন।";
  private static final String[] PROHIBITED = {"diagnos", "disease", "medicine", "drug", "prescri", "emergency", "urgent", "রোগ নির্ণ", "ওষুধ", "প্রেসক্র", "জরুরি", "আজই", "হাসপাতাল"};
  private CaregiverSummaryPolicy() { }
  public static boolean isSafe(String candidate) {
    if (candidate == null || candidate.isBlank() || candidate.length() > 280) return false;
    String normalised = candidate.toLowerCase(Locale.ROOT);
    for (String term : PROHIBITED) if (normalised.contains(term)) return false;
    return true;
  }
}
