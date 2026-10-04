"""A beginner-friendly Chinese vocabulary quiz game."""


QUESTIONS = [
    ("苹果", ["Apple", "Banana", "Orange", "Grape"], "A"),
    ("猫", ["Bird", "Fish", "Cat", "Dog"], "C"),
    ("水", ["Tea", "Water", "Milk", "Juice"], "B"),
    ("书", ["Book", "Chair", "Table", "Pen"], "A"),
    ("朋友", ["Teacher", "Family", "Student", "Friend"], "D"),
]


def ask_question(number, chinese_word, choices, correct_answer):
    """Display one question and return True when the answer is correct."""
    print(f"\nQuestion {number}/5: What does {chinese_word} mean? 🤔")
    for letter, choice in zip("ABCD", choices):
        print(f"  {letter}. {choice}")

    while True:
        answer = input("Your answer (A, B, C, or D): ").strip().upper()
        if answer in "ABCD" and len(answer) == 1:
            break
        print("Please enter A, B, C, or D. 😊")

    if answer == correct_answer:
        print("Correct! 太棒了! 🎉")
        return True

    correct_choice = choices["ABCD".index(correct_answer)]
    print(f"Not quite! The answer is {correct_answer}. {correct_choice}. 🌱")
    return False


def main():
    """Run the five-question quiz and display the final score."""
    print("🐼 Welcome to the Chinese Vocabulary Quiz! 🇨🇳")
    print("Choose the English meaning of each Chinese word.")

    score = 0
    for number, question in enumerate(QUESTIONS, start=1):
        if ask_question(number, *question):
            score += 1

    print("\n✨ Quiz complete! ✨")
    print(f"Your final score is {score} out of {len(QUESTIONS)}. 🏆")

    if score == len(QUESTIONS):
        print("Perfect score! 中文小明星! 🌟")
    elif score >= 3:
        print("Great job! Keep practicing! 💪")
    else:
        print("Nice try! Every question helps you learn! 📚")


if __name__ == "__main__":
    main()
