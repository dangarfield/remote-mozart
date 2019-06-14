
exports.installFile = async (req, res) => {
  console.log('GET /api/install-file')
  const file = '/install-files/mozart_run.sh'
  res.redirect(file)
}
