mkdir -p .bundle/

cd .bundle
cp -a ../controllers/ controllers
cp -a ../definitions/ definitions
cp -a ../databases/ databases
cp -a ../operations/ schemas
cp -a ../schemas/ schemas
cp -a ../public/ public
cp -a ../resources/ resources
cp -a ../tasks/ tasks
cp -a ../views/ views

tpm create iam.package
cp iam.package ../iam.bundle

cd ..
rm -rf .bundle
echo "DONE"