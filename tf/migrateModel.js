let net;
const webcamEle = document.getElementById('webcam');
// const classifier = knnClassifier.create();

async function app() {
    console.log('Loading');

    net = await mobilenet.load();
    console.log('Successfully Loaded');

    // 图片识别
    const imgEl = document.getElementById('img');
    const result = await net.classify(imgEl);
    console.log(result)

    // 摄像头识别
    await setupWebcam();

    const addExample = classId => {
        const activation = net.infer(webcamEle, 'conv_preds');

        classifier.addExample(activation, classId)
    };

    document.getElementById('class-a').addEventListener('click', () => addExample(0));
    document.getElementById('class-b').addEventListener('click', () => addExample(1));
    document.getElementById('class-c').addEventListener('click', () => addExample(2));

    while (true) {
        if (classifier.getNumClasses() > 0) {
            const activation = net.infer(webcamEle, 'conv_preds');
            const result = await classifier.predictClass(activation);
            const classes = ['A', 'B', 'C'];
            document.getElementById('console').innerText = `
            prediction:${classes[result.classIndex]}\n
            probability:${result.confidences[result.classIndex]}
            `
        }
        await tf.nextFrame()
    }
}

async function setupWebcam() {
    return new Promise((resolve, reject) => {
        const navigatorAny = navigator;
        navigator.getUserMedia = navigator.getUserMedia || navigatorAny.webkitGetUserMedia || navigatorAny.mozGetUserMedia || navigatorAny.msGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({video: true}, stream => {
                webcamEle.srcObject = stream;
                webcamEle.addEventListener('loadeddata', () => resolve(), false)
            }, error => reject(error))
        } else reject()
    })
}

app();
