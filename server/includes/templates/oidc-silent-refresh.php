<!doctype html>
<html>
<head>
        <title>OIDC silent refresh page</title>
</head>
<body>
<script type="text/javascript"><?php require(BASE_PATH . 'client/oidc/oidc-client.js'); ?></script>
<script>
document.addEventListener("DOMContentLoaded", function() {
        new Oidc.UserManager().signinSilentCallback()
                .catch((err) => {
                        console.log('silent refresh callback failed', err);
                });
});
</script>
</body>
</html>
