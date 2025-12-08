package com.example.domain.event

import com.example.domain.place.Places
import com.example.util.LocalDateTimeSerializer
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object Events : LongIdTable("events") {
    val title = varchar("title", 255)
    val placeId = reference("place_id", Places).nullable()
    val placeName = varchar("place_name", 255)
    val location = varchar("location", 255)
    val startAt = datetime("start_at")
    val endAt = datetime("end_at").nullable()
    val category = varchar("category", 50).default("모임") // 모임, 클래스
    val capacity = integer("capacity").default(20)
    val spotInfo = varchar("spot_info", 255).default("")
    val description = text("description").nullable()
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
}

@Serializable
data class Event(
    val id: Long,
    val title: String,
    val placeId: Long?,
    val placeName: String,
    val location: String,
    @Serializable(with = LocalDateTimeSerializer::class)
    val startAt: LocalDateTime,
    @Serializable(with = LocalDateTimeSerializer::class)
    val endAt: LocalDateTime?,
    val category: String,
    val capacity: Int,
    val spotInfo: String,
    val description: String?,
    @Serializable(with = LocalDateTimeSerializer::class)
    val createdAt: LocalDateTime,
    val currentParticipants: Int = 0
)
