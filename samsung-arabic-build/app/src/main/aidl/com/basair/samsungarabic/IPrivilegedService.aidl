package com.basair.samsungarabic;

interface IPrivilegedService {
    String exec(String command);
    String diagnosticState();
    String installCoreTheme(in byte[] apkBytes);
    String setArabicLocale(String languageTag);
    String bestEffortReapply(String packageName);
    String applyDefaultTheme();
}
