pref('extensions.kabl.enabled', true);
pref('extensions.kabl.rules', "[Settings]\nthreshold=10\ncutoff=100\n\n# \"Whitelist\" a particular domain\n[Group]\nscore=-100\nrule=$url.host=='www.example.com'\n\n# Block web pages from accessing chrome files\n[Group]\nscore=100\nmatch=all\nrule=$url.scheme=='chrome'\nrule=$origin.scheme!='chrome'\n\n# Assign karma to third party resources\n[Group]\nscore=5\nrule=$thirdParty==true\n\n# Assign karma to URLs with a word that starts \"ad\" or \"banner\"\n[Group]\nscore=5\nrule=$url=~'\\b(ad|banner)'");
pref('extensions.kabl.debug', 0);
