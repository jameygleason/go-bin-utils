#!/usr/bin/env sh

echo ""
echo Installing Root Deps
echo ""
rm -rf node_modules package-lock.json
npm i

echo ""
echo Installing Package Deps
echo ""
cd package
rm -rf node_modules package-lock.json
npm i
echo ""
cd ..
