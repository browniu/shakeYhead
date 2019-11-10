import {MnistData} from './data.js';

// 初始化数据
async function getData() {
    const data = new MnistData();
    await data.load();
    await showExamples(data);
    return data
}

// 建立模型
function getModel() {
    // 初始化
    const model = tf.sequential();
    // 卷积层
    model.add(tf.layers.conv2d({
        inputShape: [28, 28, 1],
        kernelSize: 5,
        filters: 8,
        strides: 1,
        activation: 'relu',
        kernalInitializer: 'varianceScaling'
    }));
    // 池化层
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
    // 卷积层
    model.add(tf.layers.conv2d({
        kernelSize: 5,
        filters: 16,
        strides: 1,
        activation: 'relu',
        kernalInitializer: 'varianceScaling'
    }));
    // 池化层
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));
    // 展开层
    model.add(tf.layers.flatten());
    // 全连接层
    model.add(tf.layers.dense({
        units: 10,
        kernalInitializer: 'varianceScaling',
        activation: 'softmax'
    }));
    // 编译模型
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    // 监控模型
    tfvis.show.modelSummary({name: 'Model Architecture'}, model);
    return model
}

// 训练模型
async function train(model, data) {
    // 设置监控指标
    const metrics = ['loss', 'val_loss', 'acc', 'val_acc'];
    const container = {
        name: 'Model Training', styles: {height: '1000px'}
    };
    const fitCallbacks = tfvis.show.fitCallbacks(container, metrics);

    const BATCH_SIZE = 512;
    const TRAIN_DATA_SIZE = 5500;
    const TEST_DATA_SIZE = 1000;

    const [trainXs, trainYs] = tf.tidy(() => {
        const d = data.nextTrainBatch(TRAIN_DATA_SIZE);
        return [
            d.xs.reshape([TRAIN_DATA_SIZE, 28, 28, 1]),
            d.labels
        ]
    });

    const [testXs, testYs] = tf.tidy(() => {
        const d = data.nextTestBatch(TEST_DATA_SIZE);
        return [
            d.xs.reshape([TEST_DATA_SIZE, 28, 28, 1]),
            d.labels
        ]
    });

    return model.fit(trainXs, trainYs, {
        batchSize: BATCH_SIZE,
        validationData: [testXs, testYs],
        epochs: 10,
        shuffle: true,
        callbacks: fitCallbacks
    })
}

// 测试模型
async function doPrediction(model, data, testDataSize = 500) {
    const classNames = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const IMAGE_WIDTH = 28;
    const IMAGE_HEIGHT = 28;
    const testData = data.nextTestBatch(testDataSize);
    const testxs = testData.xs.reshape([testDataSize, IMAGE_WIDTH, IMAGE_HEIGHT, 1])
    const labels = testData.labels.argMax([-1]);

    const preds = model.predict(testxs).argMax([-1]);
    // 内存回收
    testxs.dispose();
    // 监控
    await showAccuracy([preds, labels, classNames]);
    await showConfusion([preds, labels, classNames]);
    // 内存回收
    labels.dispose()
}

// 监控模型
async function showExamples(data) {
    // Create a container in the visor
    const surface =
        tfvis.visor().surface({name: 'Input Data Examples', tab: 'Input Data'});

    // Get the examples
    const examples = data.nextTestBatch(20);
    const numExamples = examples.xs.shape[0];

    // Create a canvas element to render each example
    for (let i = 0; i < numExamples; i++) {
        const imageTensor = tf.tidy(() => {
            // Reshape the image to 28x28 px
            return examples.xs
                .slice([i, 0], [1, examples.xs.shape[1]])
                .reshape([28, 28, 1]);
        });

        const canvas = document.createElement('canvas');
        canvas.width = 28;
        canvas.height = 28;
        canvas.style = 'margin: 4px;';
        await tf.browser.toPixels(imageTensor, canvas);
        surface.drawArea.appendChild(canvas);

        imageTensor.dispose();
    }
}
async function showAccuracy(predictResult) {
    const [preds, labels, classNames] = predictResult;
    const classAccuracy = await tfvis.metrics.perClassAccuracy(labels, preds);
    const container = {name: 'Accuracy', tab: 'Evaluation'};
    tfvis.show.perClassAccuracy(container, classAccuracy, classNames);
}
async function showConfusion(predictResult) {
    const [preds, labels, classNames] = predictResult;
    const confusionMatrix = await tfvis.metrics.confusionMatrix(labels, preds);
    const container = {name: 'Confusion Matrix', tab: 'Evaluation'};
    tfvis.render.confusionMatrix(container, {values: confusionMatrix}, classNames);
}

// 运行程序
async function run() {
    // 初始化数据
    const data = await getData();
    // 初始化模型
    const model = getModel();
    // 执行训练
    await train(model, data);
    // 执行测试
    await doPrediction(model, data)
}

// 运行
document.addEventListener('DOMContentLoaded', run);