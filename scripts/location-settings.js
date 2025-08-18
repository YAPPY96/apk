// 画像上のピクセル座標と緯度経度の対応表
const pixelToLatLon = [
    { pixel: { x: 80.56, y: 20.00 }, latLon: { lat: 35.159542, lon: 136.923436 } },
    { pixel: { x: 16.11, y: 583.33 }, latLon: { lat: 35.156372, lon: 136.923083 } },
    { pixel: { x: 593.89, y: 542.78 }, latLon: { lat: 35.156549, lon: 136.927038 } },
    { pixel: { x: 398.33, y: 135.56 }, latLon: { lat: 35.158874, lon: 136.925713 } }
];

// ピクセル座標から緯度経度を推定する関数
function estimateLatLonFromPixel(pixelX, pixelY) {
    // ここでは、単純な線形補間を行います。
    // より正確な推定が必要な場合は、多項式補間やその他の手法を検討してください。

    // 補間のための計算 (例: 簡単な平均値)
    let totalLat = 0;
    let totalLon = 0;
    for (let i = 0; i < pixelToLatLon.length; i++) {
        const entry = pixelToLatLon[i];
        totalLat += entry.latLon.lat;
        totalLon += entry.latLon.lon;
    }

    const averageLat = totalLat / pixelToLatLon.length;
    const averageLon = totalLon / pixelToLatLon.length;

    // これはあくまで初期値です。実際の値は、pixelToLatLonテのデータに基づいて調整してください。
    return { lat: averageLat, lon: averageLon };
}

// 使用例
const pixelX = 100;
const pixelY = 200;
const estimatedLatLon = estimateLatLonFromPixel(pixelX, pixelY);
console.log(`ピクセル(${pixelX}, ${pixelY})の推定される緯度経度: (${estimatedLatLon.lat}, ${estimatedLatLon.lon})`);


// 値を変更する場合:
// pixelToLatLon[0].latLon.lat = 新しい緯度値;
// pixelToLatLon[0].latLon.lon = 新しい経度値;
// pixelToLatLon[1].pixel.x = 新しいx座標値;
// pixelToLatLon[2].pixel.y = 新しいy座標値;