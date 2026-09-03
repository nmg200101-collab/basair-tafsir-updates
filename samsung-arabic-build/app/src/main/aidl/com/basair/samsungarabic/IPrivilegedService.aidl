package com.basair.samsungarabic;

interface IPrivilegedService {
    String exec(String command);
    String diagnosticState();
    String setArabicLocale(String languageTag);
    String bestEffortReapply(String packageName);
    String applyDefaultTheme();
    void destroy() = 16777114;
}
