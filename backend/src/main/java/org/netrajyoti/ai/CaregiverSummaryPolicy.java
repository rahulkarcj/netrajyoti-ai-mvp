package org.netrajyoti.ai;

import java.util.Locale;
import org.netrajyoti.routing.RoutingOutcome;

/** Final Java guardrail; Ollama output is never trusted by itself. */
public final class CaregiverSummaryPolicy {
  private static final String[] PROHIBITED = {"diagnos", "disease", "medicine", "drug", "prescri", "dose", "treatment", "cure", "রোগ নির্ণ", "ওষুধ", "প্রেসক্র", "ডোজ", "চিকিৎসা দিন", "আরোগ্য"};
  private CaregiverSummaryPolicy() { }

  public static String fallbackFor(RoutingOutcome outcome) {
    return switch (outcome) {
      case URGENT -> "এই তথ্যের ভিত্তিতে আজই জরুরি চোখের চিকিৎসাসেবা নেওয়া গুরুত্বপূর্ণ। দেরি করবেন না; সম্ভব হলে পরিবারের একজন বিশ্বস্ত সদস্যকে সঙ্গে নিন।";
      case ROUTINE -> "আপনার নির্বাচিত লক্ষণগুলোর জন্য, জরুরি সতর্ক-লক্ষণ না থাকলে আগামী কয়েক দিনের মধ্যে নিকটবর্তী ভিশন সেন্টার বা চোখের ক্লিনিকে চোখ পরীক্ষা করান। যাওয়ার আগে সময় নিশ্চিত করুন।";
      case HUMAN_SUPPORT -> "এই তথ্যের ভিত্তিতে একজন স্বাস্থ্যকর্মী বা চোখের সেবাকেন্দ্রের সহায়তা নেওয়া নিরাপদ হবে। নিকটবর্তী PHC, ASHA কর্মী, ভিশন সেন্টার বা চোখের ক্লিনিকের সঙ্গে কথা বলুন।";
    };
  }

  public static boolean isSafeForRoute(String candidate, RoutingOutcome outcome) {
    if (candidate == null || candidate.isBlank() || candidate.length() > 460) return false;
    String normalised = candidate.toLowerCase(Locale.ROOT);
    for (String term : PROHIBITED) if (normalised.contains(term)) return false;
    return outcome != RoutingOutcome.URGENT || normalised.contains("আজই") || normalised.contains("দেরি");
  }

  /** Retained for the legacy unit tests; route-aware validation is used at runtime. */
  public static boolean isSafe(String candidate) {
    return isSafeForRoute(candidate, RoutingOutcome.ROUTINE);
  }
}
