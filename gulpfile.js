//scss
const {src, dest, watch, series} = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('cssnano');
//js
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const browserify = require('browserify');
var rename = require('gulp-rename');
const del = require('del');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

//image
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const changed = require('gulp-changed');
//browsersync
const browsersync = require('browser-sync').create();


//sass 変換縮小
function scssTask() {
  return src('./sass/**/*.scss', { sourcemaps: true })
    // .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(postcss([cssnano()]))
    .pipe(autoprefixer())
    .pipe(dest('./', {sourcemaps: '.'}));
}

//Javascript 結合
function concatJsTask(){
    return src('./js/*.js')
        .pipe(concat('scripts.js'))
        .pipe(dest('./js'));
}

//複数のJavascriptファイルをまとめる
function browserifyTask(){
    return browserify('./js/scripts.js')
        .bundle()
        .pipe(source('scripts.js'))
        .pipe(buffer())
        .pipe(dest('./js'));
}

// javascript のトランスコンパイル
function jsDevTask(){
    return src(['./js/scripts.js'], { sourcemaps: true })
        .pipe(babel({ presets: ['@babel/preset-env']}))
        .pipe(dest('./js', { sourcemaps: '.' }));
}

//javascriptファイルのmin化
function jsProdTask(){
    return src(['./js/scripts.js'], { sourcemaps: true })
      .pipe(babel({ presets: ['@babel/preset-env']}))
      .pipe(uglify())
      .pipe(rename({extname: '.min.js'}))
      .pipe(dest('./dist', { sourcemaps: '.' }));
}

//生成されたscript.jsファイルを削除
function cleanTask(){
    return del('./js/scripts.js');
}

//画像圧縮
function imageminTask(){
  return src('./img/**')
    .pipe(changed('./img/**'))
    .pipe(
      imagemin([
        pngquant({
          quality: [.60, .70], // 画質
          speed: 1 // スピード
        }),
        mozjpeg({ quality: 80 }), // 画質
        imagemin.svgo({
          plugins: [
          {removeViewBox: false},//、imagemin-svgoでSVGを圧縮するとwidthとheightも一緒に削除されてしまいます。IE11ではwidthとheightがない場合、表示が崩れてしまう問題が発生してしまうので、削除されないようにします。
          {cleanupIDs: false}
          ]
        }),
        imagemin.optipng(),
        imagemin.gifsicle({ optimizationLevel: 3 }) // 圧縮率
      ])
    )
    .pipe(dest('./img'));
}

//ブラウザの設定(自分で設定)
function browsersyncServe(cb) {
 browsersync.init({
      proxy: 'http://test.wp',  // Local by Flywheelのドメイン
      open: true,
      watchOptions: {
          debounceDelay: 1000  //1秒間、タスクの再実行を抑制
      }
 });
  cb();
}

function browsersyncReload(cb) {
  browsersync.reload();
  cb();
}

//watch task
function watchTask() {
  watch('./**/*.php', browsersyncReload);
  watch(
  ['./sass/**/*.scss', './js/**/*.js', '!./js/scripts.js', './img/**'],
    series(
      scssTask,
      concatJsTask,
      browserifyTask,
      jsDevTask,
      jsProdTask,
      cleanTask,
      imageminTask,
      browsersyncReload
    ));
}

//defaul Gulp task
exports.default = series(
  scssTask,
  concatJsTask,
  browserifyTask,
  jsDevTask,
  jsProdTask,
  cleanTask,
  imageminTask,
  browsersyncServe,
  browsersyncReload,
  watchTask
)

//本番環境では不要なタスク
exports.prod = series(
    scssTask,
    concatJsTask,
    browserifyTask,
    jsProdTask,
    cleanTask,
    imageminTask,
);
