<?php
echo password_hash('admin123', PASSWORD_BCRYPT);
?>
```

Visit `http://localhost/gen_hash.php` in your browser. It will output something like:
```
$2y$10$xJ8kLmN3qR5vT7uW9yA1Oe6PdF2gH4iK0jM8nQ1sV3wX5zB7cD9E