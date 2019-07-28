// 获取原始数据
async function getData() {
    const carDataReq = await fetch('https://storage.googleapis.com/tfjs-tutorials/carsData.json');
    const carsData = await carDataReq.json();
    const cleaned = carsData.map(car => ({
        mpg: car.Miles_per_Gallon,
        horsepower: car.Horsepower
    })).filter(car => (car.mpg != null && car.horsepower != null));
    return cleaned
}

// 转化为张量数据
function convarToTenser(data) {
    return tf.tidy(() => {
        //洗牌改组
        tf.util.shuffle(data);
        //转为张量
        const inputs = data.map(d => d.horsepower);
        const labels = data.map(d => d.mpg);
        const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
        const labelTensor = tf.tensor2d(labels, [labels.length, 1]);
        //规范化（缩放至0-1之间）
        const inputMax = inputTensor.max();
        const inputMin = inputTensor.min();
        const labelMax = labelTensor.max();
        const labelMin = labelTensor.min();
        const normalizedInputs = inputTensor.sub(inputMin).div(inputMax.sub(inputMin));
        const normalizedLabels = labelTensor.sub(labelMin).div(labelMax.sub(labelMin));
        //返回数据和 缩放边界（用于输出数据的恢复）
        return {
            inputs: normalizedInputs,
            labels: normalizedLabels,
            inputMax,
            inputMin,
            labelMax,
            labelMin
        }
    })
}

// 测试模型&监控
function testModel(model, inputData, normalizationData) {
    const {inputMax, inputMin, labelMax, labelMin} = normalizationData
    const [xs, preds] = tf.tidy(() => {
        const xs = tf.linspace(0, 1, 100);
        const preds = model.predict(xs.reshape([100, 1]));
        const unNormXs = xs.mul(inputMax.sub(inputMin)).add(inputMin);
        const unNormPreds = preds.mul(labelMax.sub(labelMin)).add(labelMin)
        return [unNormXs.dataSync(), unNormPreds.dataSync()]
    });

    const predictPoints = Array.from(xs).map((val, i) => {
        return {x: val, y: preds[i]}
    });
    const originalPoints = inputData.map(d => ({x: d.horsepower, y: d.mpg}))
    tfvis.render.scatterplot(
        {name: 'Model Predictions vs Original Data'},
        {values: [originalPoints, predictPoints], series: ['original', 'predicted']},
        {xLabel: 'Horsepower', yLabel: 'MPG', height: 300}
    )
}

async function run() {
    // 初始化数据&监控
    const data = await getData();
    const tensorData = convarToTenser(data);
    const {inputs, labels} = tensorData;
    const values = data.map(d => ({
        x: d.horsepower,
        y: d.mpg
    }));
    tfvis.render.scatterplot(
        {name: 'Horsepower vs MPG'},
        {values},
        {
            xLabel: 'Horsepower',
            yLabel: 'MPG',
            height: 300
        }
    );

    const model = await tf.loadLayersModel('http://192.168.31.142:5000/model/my-first-model.json');
    tfvis.show.modelSummary({name: 'Model Summary'}, model);

    await testModel(model, data, tensorData);
    console.log('Done Testing');
}
run();
