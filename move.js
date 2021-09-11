/**
 * 输出图片文件到同一目录
 */

const fs = require('fs');

/** 需要复制的目录 */
const dir = "./resources"

/** 输出到目录 */
const out = "./out/"

let count = 0;

let filenames = [];

function getNewPath(path) {
  if (filenames.includes(path)) {
    return getNewPath("0" + path);
  } else {
    return path;
  }
}

/*
 * 复制目录、子目录，及其中的文件
 * @param src {String} 要复制的目录
 * @param dist {String} 复制到目标目录
 */
function copyDir(src, dist, callback) {
    fs.access(dist, function(err){
      if(err){
        // 目录不存在时创建目录
        fs.mkdirSync(dist);
      }
      _copy(null, src, dist);
    });
  
    function _copy(err, src, dist) {
      if(err){
        callback(err);
      } else {
        fs.readdir(src, function(err, paths) {
          if(err){
            callback(err)
          } else {
            paths.forEach(function(path) {
              var _src = src + '/' +path;
              fs.stat(_src, function(err, stat) {
                if(err){
                  callback(err);
                } else {
                  // 判断是文件还是目录
                  if(stat.isFile()) {
                    path = getNewPath(path);
                    filenames.push(path);
                    var _dist = dist + path;
                    fs.writeFileSync(_dist, fs.readFileSync(_src));
                  } else if(stat.isDirectory()) {
                    count ++;
                    console.log(count + "目录：",_src);
                    // 当是目录是，递归复制
                    copyDir(_src, dist, callback)
                  }
                }
              })
            })
          }
        })
      }
    }
}


copyDir(dir,out,(err)=>{
    console.log("err:",err);
})
