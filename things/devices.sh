#!/usr/bin/env bash

cd "$(dirname "$0")"
set -e

gencert() {
    local d="$1"
    aws iot create-keys-and-certificate \
        --private-key-outfile "$d-private.pem.key" \
        --certificate-pem-outfile "$d-certificate.pem.crt" \
        --set-as-active \
        --query 'certificateArn' \
        --output text
}

operation() {
    local stackname="$1"
    aws cloudformation describe-stacks --stack-name "$stackname" &> /dev/null
    if [ "$?" -eq 0 ]; then
        echo -n update
    else
        echo -n create
    fi
}

provision() {
    local stackname="$1"
    local op="$2"
    local cert="$3"

    certParam='ParameterKey=CertificateArn,UsePreviousValue=true'
    if [ "$cert" != "" ]; then
        certParam="ParameterKey=CertificateArn,ParameterValue=${cert}"
    fi

    aws cloudformation "${op}-stack" \
        --stack-name "$stackname" \
        --template-body file://device.yaml \
        --parameters "$certParam" \
        --capabilities CAPABILITY_IAM

}

createOrUpdate() {
    local thing="$1"
    local stack="iot-codecraft-thing-${thing}"
    local op=$(operation "$stack");

    if [ "$op" == "update" ]; then
        echo "updating $stack"
        provision "$stack" "$op"
    else
        echo "creating $stack"
        local cert=$(gencert "$thing")
        echo "certificate $cert"
        provision "$stack" "$op" "$cert"
    fi

}

createOrUpdate Garage || echo $?

