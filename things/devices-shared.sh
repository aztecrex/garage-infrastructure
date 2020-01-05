
# not using this in this project, it's for reference

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

    aws cloudformation "${op}-stack" \
        --stack-name "$stackname" \
        --template-body file://devices.yaml \
        --capabilities CAPABILITY_IAM

}

stack="iot-demo-devices"
op=$(operation "$stack")

provision "$stack" "$op"

