#!/usr/bin/env python3
"""
Eureka! SQLite 数据库初始化脚本
创建三个核心表：projects, stage_executions, deliverables
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "database" / "eureka.db"

def init_database():
    """初始化数据库表结构"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. 创建项目表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            project_id TEXT PRIMARY KEY,
            created_at TEXT,
            status TEXT,
            customer_requirement TEXT,
            current_stage TEXT,
            updated_at TEXT
        )
    """)
    
    # 2. 创建阶段执行记录表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stage_executions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,
            stage INTEGER,
            stage_name TEXT,
            skill_name TEXT,
            status TEXT,
            started_at TEXT,
            completed_at TEXT,
            error_message TEXT,
            output_file TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(project_id)
        )
    """)
    
    # 3. 创建交付物表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS deliverables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT,
            deliverable_type TEXT,
            file_path TEXT,
            created_at TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(project_id)
        )
    """)
    
    # 创建索引
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_stage_executions_project_id 
        ON stage_executions(project_id)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_deliverables_project_id 
        ON deliverables(project_id)
    """)
    
    conn.commit()
    print(f"✅ 数据库初始化成功: {DB_PATH}")
    print("\n表结构:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    for table in cursor.fetchall():
        print(f"  - {table[0]}")
    
    conn.close()

if __name__ == "__main__":
    init_database()
