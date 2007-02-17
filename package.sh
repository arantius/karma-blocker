#!/bin/sh

# derive project name and version
PROJ=`awk '/^content/{print $2}' chrome.manifest`
rm -f ${PROJ}*.xpi
VER=`sed -n -e '/em:version/{s/[^0-9.]//g;p}' install.rdf`

echo BUILDING...

rm -fr build
mkdir build

# make build tree
find . -name '.svn' -prune -false -o \
	-type d -not -name '.svn' -a -not -name 'build'  -a -not -name '.' \
	-exec mkdir "build/{}" \;
# copy files in
find . -name '.svn' -prune -false -o \
	-type f -not -name 'package.sh' \
	-exec cp "{}" "build/{}" \;

cd build

# create the jar, patch the manifest to reference it
echo CREATING: "${PROJ}.jar"

sed \
	-e "/^content/s/\(.*\) \(.*\)/\1 jar:${PROJ}.jar!\/\2/" \
	-e "/^skin/s/\(.*\) \(.*\)/\1 jar:${PROJ}.jar!\/\2/" \
	-e "/^locale/s/\(.*\) \(.*\)/\1 jar:${PROJ}.jar!\/\2/" \
	chrome.manifest > chrome.manifest.jar
mv chrome.manifest.jar chrome.manifest

find content/ skin/ | \
	zip -r -0 -@ "${PROJ}.jar" > /dev/null
rm -fr content/ skin/

# zip together the jar and the rest into the xpi
echo CREATING: "${PROJ}-${VER}.xpi"
zip -r -9 "../${PROJ}-${VER}.xpi" * > /dev/null

cd ..
rm -rf build/
