if [ ! -f "deployment.key.json" ]; then
    echo ${DEPLOYMENT_KEY} | base64 --decode --ignore-garbage > deployment.key.json
fi

gcloud auth activate-service-account --key-file deployment.key.json
echo "Setting deployment client email to ${DEPLOYMENT_CLIENT_EMAIL}" | sed -e 's/google//'
gcloud auth list | sed -e 's/google//'
echo "Return code for gcloud auth list is $?"

gcloud config set account $DEPLOYMENT_CLIENT_EMAIL
echo "Setting deployment project to ${DEPLOYMENT_PROJECT_ID}" | sed -e 's/idc//'
gcloud config set project "$DEPLOYMENT_PROJECT_ID"
