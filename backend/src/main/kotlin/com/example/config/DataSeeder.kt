package com.example.config

import com.example.domain.event.Events
import com.example.domain.place.Places
import org.jetbrains.exposed.dao.id.EntityID
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.LocalDateTime
import java.time.LocalTime

object DataSeeder {
    fun seed() {
        transaction {
            if (Places.selectAll().empty()) {
                Places.insert {
                    it[name] = "성수 로스터리 키친"
                    it[tag] = "공유주방"
                    it[meta] = "야간 예약 가능 · 12석"
                    it[location] = "성동구"
                    it[description] = "성수에서 운영되는 공유주방. 베이킹/요리 클래스를 위한 야간 슬롯 제공."
                }
                Places.insert {
                    it[name] = "합정 동네책방 온"
                    it[tag] = "독립서점"
                    it[meta] = "리딩모임 3개 진행 중"
                    it[location] = "마포구"
                    it[description] = "작은 독립서점. 독서모임과 소규모 북토크가 활발히 열리는 공간."
                }
                Places.insert {
                    it[name] = "망원 커먼스튜디오"
                    it[tag] = "스튜디오"
                    it[meta] = "사진 · 원데이 클래스"
                    it[location] = "마포구"
                    it[description] = "사진/영상 촬영과 원데이 클래스를 함께 진행하는 다목적 스튜디오."
                }
            }

            if (Events.selectAll().empty()) {
                val today = LocalDateTime.now().with(LocalTime.of(10, 0))
                val plusDays = { d: Long, hour: Int -> today.plusDays(d).withHour(hour).withMinute(30) }

                Events.insert {
                    it[title] = "초보 베이킹 원데이"
                    it[placeName] = "성수 로스터리 키친"
                    it[placeId] = EntityID(1, Places)
                    it[location] = "성동구"
                    it[startAt] = plusDays(0, 19) // 오늘 19:30
                    it[spotInfo] = "3자리 남음"
                }
                Events.insert {
                    it[title] = "동네상권 스터디"
                    it[placeName] = "합정 동네책방 온"
                    it[placeId] = EntityID(2, Places)
                    it[location] = "마포구"
                    it[startAt] = plusDays(2, 20) // +2일 20:30 -> adjust minute? 
                    it[spotInfo] = "무료 · 18명"
                }
                Events.insert {
                    it[title] = "사진 함께 찍어요"
                    it[placeName] = "망원 커먼스튜디오"
                    it[placeId] = EntityID(3, Places)
                    it[location] = "마포구"
                    it[startAt] = plusDays(4, 18) // +4일 18:30
                    it[spotInfo] = "5팀 모집"
                }
            }
        }
    }
}
