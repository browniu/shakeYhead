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

function useModel(model, input, normalizationData) {
    const {inputMax, inputMin, labelMax, labelMin} = normalizationData;
    console.log(labelMax, labelMin);
    const a = tf.tensor([input]);
    const result = model.predict(a).mul(labelMax.sub(labelMin)).add(labelMin);
    result.data().then(data => console.log(data))
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

    await useModel(model, 95, tensorData);
    console.log('Done Useing');
}

run();