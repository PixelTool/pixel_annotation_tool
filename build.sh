#!/bin/bash

BUILD_DIR=PixelAnnotationTool

echo Building Chrome extension

echo Prepare copy files to tmp build path
if [ -d $BUILD_DIR ]; then
    rm -r $BUILD_DIR
fi

mkdir -p $BUILD_DIR

cp manifest.json $BUILD_DIR
cp *.png $BUILD_DIR
cp -r build $BUILD_DIR


echo Start packaging
dir=$BUILD_DIR
key=./keys/at.pem


##### INSTALL THIS FIRST https://rubygems.org/gems/crxmake
##### https://github.com/Constellation/crxmake

crxmake --pack-extension=$dir --extension-output=packaged/PixelAnnotationTool.crx 

echo Done!
