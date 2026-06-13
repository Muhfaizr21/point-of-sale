package models

type StoreSetting struct {
	ID    uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Key   string `gorm:"type:varchar(100);uniqueIndex;not null" json:"key"`
	Value string `gorm:"type:text;not null" json:"value"`
}
