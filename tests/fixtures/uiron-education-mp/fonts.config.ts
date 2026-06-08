import { defineConfig } from '../../../src/config'

export default defineConfig({
  build: {
    scan: {
      srcDir: ['src'],
      extensions: ['vue', 'ts', 'tsx', 'js', 'jsx', 'scss', 'css']
    },
    fonts: [
      {
        family: 'Alibaba PuHuiTi',
        name: 'Regular',
        weight: 400,
        url: 'https://table-cos.xironiot.com/cos_coach/static/fonts/origin/AlibabaPuHuiTi-3-55-Regular.ttf'
      },
      {
        family: 'Alibaba PuHuiTi',
        name: 'Medium',
        weight: 500,
        url: 'https://table-cos.xironiot.com/cos_coach/static/fonts/origin/AlibabaPuHuiTi-3-65-Medium.ttf'
      },
      {
        family: 'Alibaba PuHuiTi',
        name: 'SemiBold',
        weight: 600,
        url: 'https://table-cos.xironiot.com/cos_coach/static/fonts/origin/AlibabaPuHuiTi-3-75-SemiBold.ttf'
      },
      {
        family: 'Alibaba PuHuiTi',
        name: 'Bold',
        weight: 700,
        url: 'https://table-cos.xironiot.com/cos_coach/static/fonts/origin/AlibabaPuHuiTi-3-85-Bold.ttf'
      },
      {
        family: 'Alibaba PuHuiTi',
        name: 'Heavy',
        weight: 900,
        url: 'https://table-cos.xironiot.com/cos_coach/static/fonts/origin/AlibabaPuHuiTi-3-105-Heavy.ttf',
        extraText: ['中式八球九球追分斯诺克青少年']
      },
      {
        family: 'Alibaba PuHuiTi',
        name: 'Black',
        weight: 1000,
        url: 'https://table-cos.xironiot.com/cos_coach/static/fonts/origin/AlibabaPuHuiTi-3-115-Black.ttf',
        extraText: ['大家都在学', '暑期特训计划']
      },
      {
        family: 'DingTalk JinBuTi',
        name: 'Regular',
        weight: 400,
        url: 'https://table-cos.xironiot.com/cos_coach/static/fonts/origin/DingTalk-JinBuTi.ttf'
      },
      {
        family: 'DelaGothicOne',
        name: 'Regular',
        weight: 400,
        url: 'https://table-1301872750.cos.ap-guangzhou.myqcloud.com/cos_coach/static/fonts/origin/DelaGothicOne-Regular.ttf',
        format: 'ttf'
      }
    ],
    output: {
      cssDir: 'src/styles',
      format: 'woff2',
      styleFormat: 'scss',
      fontDisplay: 'optional'
    }
  },
  upload: {
    provider: 'cos',
    concurrency: 5
  },
  cos: {
    bucket: 'table-1301872750',
    region: 'ap-guangzhou',
    basePath: '/cos_coach/static/fonts/built/{version}',
    cdnUrl: 'https://table-cos.xironiot.com'
  }
})
