const documentsDAO = require('../dao/documentsDAO')
const devicesService = require('./devicesService')
const Archiver = require('archiver')

exports.zipAllFilesForDeployment = async (deviceGroupId, deviceId, res) => {

    let deviceGroup = await devicesService.getDeviceGroup(deviceGroupId)
    let device = await devicesService.getDevice(deviceId)
    let files = []
    if(deviceGroup.deployed !== undefined) {
        files.push(deviceGroup.deployed.run)
        files.push(deviceGroup.deployed.stop)
        for (let i = 0; i < deviceGroup.deployed.files.length; i++) {
            files.push(deviceGroup.deployed.files[i])
        }
    }
    console.log('files', files)

    try {
        res.set('Content-Type', 'application/zip')
        res.set('Content-Disposition', 'attachment; filename='+deviceGroupId+'_'+deviceGroup.deployed.version+'.zip')

        let zip = Archiver('zip')
        zip.pipe(res);

        for (let i = 0; i < files.length; i++) {
            const file = await getDocumentById(files[i])
            console.log('file', file.name, file.content)
            if(file.name !== undefined && file.content !== undefined) {
                zip.append(file.content, {name: file.name})
            }
        }
        let envs = []

        if(deviceGroup.deployed.envs !== undefined) {
            for (let i = 0; i < deviceGroup.deployed.envs.length; i++) {
                const env = deviceGroup.deployed.envs[i]
                envs.push(env)
            }
        }
        // console.log('envs device group', envs)
        // console.log('envs override', device.envs)
        if(device.envs !== undefined) {
            for (let i = 0; i < device.envs.length; i++) {
                const overrideEnv = device.envs[i]
                let added = false
                for (let j = 0; j < envs.length; j++) {
                    const deviceGroupEnv = envs[j];
                    if(overrideEnv.key === deviceGroupEnv.key) {
                        deviceGroupEnv.value = overrideEnv.value
                        added = true
                        break
                    }
                }
                if(!added) {
                    envs.push(overrideEnv)
                }
            }
        }
        // console.log('envs applied', envs)
        let envStrings = []
        for (let i = 0; i < envs.length; i++) {
            const env = envs[i]
            envStrings.push(env.key + '=' + env.value)
        }
        let envString = envStrings.join('\n')
        zip.append(envString, {name: '.env'})
        zip.finalize()
    } catch (error) {
        console.log('error zipping files', error)
        res.status(500)
        res.set('Content-Type', 'application/json')
        res.json({error:true})
    }
}
const getDocumentById = exports.getDocumentById = async (id) => {
    return documentsDAO.getDocumentById(id)
}
exports.insertDocument = async (name, content) => {
    return documentsDAO.insertDocument(name, content)
}
exports.deleteDocument = async (id) => {
    await documentsDAO.deleteDocument(id)
}
