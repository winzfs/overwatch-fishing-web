// 아래 코드로 교체하세요.
// app/ocean/page.tsx 에서 기존 부분:
//
// this.physics.velocityFromRotation(
//   angle,
//   160,
//   fish.body.velocity
// );
//
// 를 아래처럼 수정:
//
// if (fish.body) {
//   this.physics.velocityFromRotation(
//     angle,
//     160,
//     fish.body.velocity
//   );
// }
