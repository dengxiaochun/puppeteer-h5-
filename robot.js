const puppeteer = require('puppeteer-core');
const fs = require('fs');
const mkdirp = require('mkdirp');
const DEBUG =false;
const gameName='sugarpop2';
/** 游戏链接 */
const url ='https://democasino.betsoftgaming.com/free/en/launch.jsp;jsessionid=DE25B4BEEB1E658F6DE058B2DEABF1CE.lobby1?SID=2dfc719621b8c8cf0f040000017ba83c&CDN=AUTO&GAMESERVERURL=gs1-democluster.betsoftgaming.com&gameId=784&BANKID=675&LANG=en&cashierUrl=';
const blackList=[
     'facebook' ,'google-analytics' ,'googletagmanager' ,'googleapis' ,'googlesyndication'
];
const gameStart =  async function (page) {
    //点击“PLAY NOW”
    // await page.click('.gpxLoader-button',{delay: 300});
    // console.log('加载游戏iframe...');
    // const gameFrame = page.frames().find(frame => frame.$('#game-frame'));
    // try{
    //     await Promise.all([
    //         gameFrame.waitForNavigation({timeout:120000, waitUntil:'networkidle2'}),
    //     ])
    // }catch (e) {
    // }
    const btnPosition ={
        x:960,
        y:200
    };
    //如果有开始游戏按钮，设置点击位置
    await page.mouse.click(btnPosition.x, btnPosition.y, { delay: 300 });
    console.log('点击开始游戏按钮');
};


(async () => {
    const browser = await puppeteer.launch({
        /** 浏览器地址 */
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        devtools: DEBUG, //调试打开浏览器
    });
    const outDir='./data';
    const gameDir =outDir + '/' + gameName;
    try{
        const page = await browser.newPage();
        page.setDefaultTimeout(0); //超时设置

        //处理弹窗，防止弹出导致网页加载中断
        page.on('dialog', async dialog => {
            console.log(dialog.message());
            await dialog.dismiss();
        });
        //拦截请求，黑名单中的地址，不发出请求
        page.on('request' ,function (request) {
            const url =request.url();
            if(blackList && blackList.length>0){
                for(let i in blackList){
                    if(url.indexOf(blackList[i])>-1){
                        request.abort();
                        return;
                    }
                }
            }
            request.continue();
        })
        //将响应内容保存到本地
        page.on('response', function (response) {
            const url = response.url();
            const status = response.status()
            DEBUG && console.log('Get:' ,status ,url);

            //状态码判断
            if (status !==200 ) {
                console.log('Get Warning:',status,  url);
                return;
            }
            if(url.split("://").length<2){
                console.log('Save Error:');
                return;
            }
            // console.log("response",url);
            if (url && url.split) {
                const filename = url.split("://")[1].split("?")[0];
                const dir=filename.substr(0, filename.lastIndexOf('/'));
                /** 图片存储 */
                if (url.includes(".png") || url.includes(".jpg")) {
                    response.buffer().then((buffer)=>{
                        mkdirp(gameDir+'/'+dir).then(res => {
                            fs.writeFile(gameDir + '/' +filename ,buffer ,function (e) {
                                if (e) console.error("error: eee",e)
                            })
                        })
                    })
                } else {
                    /** 文本文件存储 */
                    response.text().then((body)=>{
                        mkdirp(gameDir+'/'+dir).then(res => {
                            fs.writeFile(gameDir + '/' +filename ,body ,function (e) {
                            })
                        })
                    })
                }
            }
        });
        //设置浏览器界面尺寸
        await page.setViewport({
            width: 1920,
            height: 937,
            deviceScaleFactor: 1,
        });
        await page.setRequestInterception(true) //允许拦截请求
        console.log('页面开始加载');
        await page.goto(url , {waitUntil: 'networkidle2'});//超时问题
        await page.waitForTimeout(5000);
        console.log('页面初步加载完毕')
        
        await gameStart(page);
        console.log('游戏已开始');

        /** 等待游戏全部加载完成，时间自己设置 */
        await page.waitForTimeout(5000 * 40);
        await page.screenshot({path: gameDir + '/screenshot.png'}); //保存游戏截屏
    }catch (e) {
        console.log(e)
    }finally {
        await browser.close()
    }
})();