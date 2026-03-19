<?php
$db_file = __DIR__ . '/../../database/ojt_tracker.sqlite';
$schema_file = __DIR__ . '/../../database/ojt_tracker.sql';

try {
    $pdo = new PDO('sqlite:' . $db_file);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents($schema_file);
    
    // SQLite doesn't natively support running multiple statements separated by semicolon at once via standard query() if using complex scripts,
    // but exec() handles it.
    $pdo->exec($sql);
    
    echo "SQLite database initialized successfully at: " . realpath($db_file) . "\n";
} catch (PDOException $e) {
    echo "Error initializing database: " . $e->getMessage() . "\n";
}
?>
